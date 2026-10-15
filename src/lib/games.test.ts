import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

/** Database ids used by the catalog-filter test fixtures. */
interface FilterFixtureIds {
    strategyId: number;
    puzzleId: number;
    pubOneId: number;
}

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

/** Seeds games with two categories and publishers for filter-helper tests. */
async function seedFilterGames(db: Database): Promise<FilterFixtureIds> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'strategy games' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'puzzle games' })
        .returning({ id: categories.id });
    const [pubOne] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'first publisher' })
        .returning({ id: publishers.id });
    const [pubTwo] = await db
        .insert(publishers)
        .values({ name: 'Pub Two', description: 'second publisher' })
        .returning({ id: publishers.id });

    await db.insert(games).values([
        { title: 'Alpha', description: 'strategy one', starRating: 4, categoryId: strategy.id, publisherId: pubOne.id },
        { title: 'Bravo', description: 'strategy two', starRating: 4, categoryId: strategy.id, publisherId: pubTwo.id },
        { title: 'Charlie', description: 'puzzle one', starRating: 4, categoryId: puzzle.id, publisherId: pubOne.id },
        { title: 'Delta', description: 'puzzle two', starRating: 4, categoryId: puzzle.id, publisherId: pubTwo.id },
    ]);

    return {
        strategyId: strategy.id,
        puzzleId: puzzle.id,
        pubOneId: pubOne.id,
    };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('filters by any selected category and keeps title ordering', async () => {
        const { strategyId, puzzleId } = await seedFilterGames(db);

        const strategyGames = await getAllGames(db, { categoryIds: [strategyId] });
        const gamesFromEitherCategory = await getAllGames(db, { categoryIds: [puzzleId, strategyId] });

        expect(strategyGames.map((game) => game.title)).toEqual(['Alpha', 'Bravo']);
        expect(gamesFromEitherCategory.map((game) => game.title)).toEqual([
            'Alpha',
            'Bravo',
            'Charlie',
            'Delta',
        ]);
    });

    it('filters by publisher and combines publisher with category filters', async () => {
        const { strategyId, pubOneId } = await seedFilterGames(db);

        const publisherGames = await getAllGames(db, { publisherId: pubOneId });
        const matchingGames = await getAllGames(db, {
            categoryIds: [strategyId],
            publisherId: pubOneId,
        });

        expect(publisherGames.map((game) => game.title)).toEqual(['Alpha', 'Charlie']);
        expect(matchingGames.map((game) => game.title)).toEqual(['Alpha']);
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
