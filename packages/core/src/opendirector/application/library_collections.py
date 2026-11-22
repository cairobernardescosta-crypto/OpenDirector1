"""Non-destructive named collections over existing global-library asset IDs.

Separate metadata: older library indexes and blob lifecycles remain untouched.
A collection is never an owning reference and cannot delete an asset.
"""
from __future__ import annotations
from uuid import UUID, uuid4
from pathlib import Path
from typing import List

from filelock import FileLock
from pydantic import Field
from opendirector.domain.creation.base import Contract
from opendirector.domain.projects import ProjectError
from opendirector.infrastructure.local_projects import read_json, write_json
from opendirector.infrastructure.library_store import now
from opendirector.application.library import Library


class Collection(Contract):
    id: UUID = Field(description='Stable collection identifier.')
    name: str = Field(min_length=1, max_length=255, description='Human-readable collection name.')
    createdAt: str = Field(description='UTC creation timestamp.')
    itemIds: list[UUID] = Field(default_factory=list, max_length=100000, description='Existing library asset IDs, never owned blobs.')


class CollectionIndex(Contract):
    version: int = Field(default=1, ge=1, le=1, description='Version of the collection metadata index.')
    collections: dict[UUID, Collection] = Field(default_factory=dict, description='Collections keyed by stable identity.')


class LibraryCollections:
    """Collections don't change LibraryItem, LibraryIndex, or blob ownership."""

    def __init__(self, projects):
        self.library = Library(projects)
        self.path = Path(projects.state_dir) / 'library' / 'collections.json'
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = FileLock(str(self.path.parent / 'collections.lock'), timeout=15)

    def _read(self) -> CollectionIndex:
        return CollectionIndex.model_validate(read_json(self.path)) if self.path.exists() else CollectionIndex()

    @staticmethod
    def _label(name: str) -> str:
        label = name.strip()
        if not label or len(label) > 255:
            raise ProjectError('Nome da coleção deve conter entre 1 e 255 caracteres.', 422)
        return label

    def list(self) -> List[Collection]:
        with self.lock:
            return sorted(self._read().collections.values(), key=lambda c: c.createdAt)

    def create(self, name: str) -> Collection:
        label = self._label(name)
        with self.lock:
            index = self._read()
            if len(index.collections) >= 10000:
                raise ProjectError('Limite de coleções atingido.', 409)
            if any(c.name.casefold() == label.casefold() for c in index.collections.values()):
                raise ProjectError('Já existe uma coleção com este nome.', 409)
            item = Collection(id=uuid4(), name=label, createdAt=now())
            index.collections[item.id] = item
            write_json(self.path, index.model_dump(mode='json'))
            return item

    def rename(self, collection_id: UUID, name: str) -> Collection:
        label = self._label(name)
        with self.lock:
            index = self._read()
            current = index.collections.get(collection_id)
            if current is None:
                raise ProjectError('Coleção não encontrada.', 404)
            if any(c.id != collection_id and c.name.casefold() == label.casefold()
                   for c in index.collections.values()):
                raise ProjectError('Já existe uma coleção com este nome.', 409)
            updated = current.model_copy(update={'name': label})
            index.collections[collection_id] = updated
            write_json(self.path, index.model_dump(mode='json'))
            return updated

    def set_items(self, collection_id: UUID, item_ids: list[UUID]) -> Collection:
        """Replace membership only, never delete media or mutate source assets."""
        unique_ids = list(dict.fromkeys(item_ids))
        if len(unique_ids) > 100000:
            raise ProjectError('Limite de itens na coleção atingido.', 422)
        # Acquire library index first as a snapshot, without collecting blobs or writing it.
        active = {item.id for item in self.library.list(kind='asset', state='active')}
        if any(item_id not in active for item_id in unique_ids):
            raise ProjectError('A coleção só aceita arquivos ativos da biblioteca.', 422)
        with self.lock:
            index = self._read()
            current = index.collections.get(collection_id)
            if current is None:
                raise ProjectError('Coleção não encontrada.', 404)
            updated = current.model_copy(update={'itemIds': unique_ids})
            index.collections[collection_id] = updated
            write_json(self.path, index.model_dump(mode='json'))
            return updated

    def delete(self, collection_id: UUID) -> dict:
        with self.lock:
            index = self._read()
            if collection_id not in index.collections:
                raise ProjectError('Coleção não encontrada.', 404)
            del index.collections[collection_id]
            write_json(self.path, index.model_dump(mode='json'))
        return {'deleted': str(collection_id), 'assetsDeleted': 0}
