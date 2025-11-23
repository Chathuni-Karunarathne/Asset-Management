import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { assets } from '../db/schema.js';

const parseId = (rawId: string | undefined) => {
  if (!rawId) return null;
  const numericId = Number(rawId);
  return Number.isNaN(numericId) ? null : numericId;
};

export const getAllAssets = async (_req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch assets from database...');
    
    // Test database connection first
    try {
      const testConnection = await db.execute('SELECT 1 as test');
      console.log('Database connection test passed');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: (dbError as Error).message 
      });
    }

    const allAssets = await db.select().from(assets).orderBy(assets.id);
    console.log(`Successfully fetched ${allAssets.length} assets`);
    
    res.json(allAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assets',
      details: (error as Error).message 
    });
  }
};

// ... keep the rest of your functions the same
export const getAssetById = async (req: Request, res: Response) => {
  try {
    const assetId = parseId(req.params.id);
    if (assetId === null) {
      return res.status(400).json({ error: 'Valid asset ID is required' });
    }

    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const { name, description, category, status, purchaseDate, purchasePrice } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        category: String(category).trim(),
        status: status ? String(status).trim() : 'available',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice:
          purchasePrice === null || purchasePrice === undefined ? null : Number(purchasePrice),
      })
      .returning();

    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const assetId = parseId(req.params.id);
    if (assetId === null) {
      return res.status(400).json({ error: 'Valid asset ID is required' });
    }

    const { name, description, category, status, purchaseDate, purchasePrice } = req.body;

    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && {
          description: description ? String(description).trim() : null,
        }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(status !== undefined && { status: String(status).trim() }),
        ...(purchaseDate !== undefined && {
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        }),
        ...(purchasePrice !== undefined && {
          purchasePrice:
            purchasePrice === null || purchasePrice === '' ? null : Number(purchasePrice),
        }),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (!updatedAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const assetId = parseId(req.params.id);
    if (assetId === null) {
      return res.status(400).json({ error: 'Valid asset ID is required' });
    }

    const [deletedAsset] = await db.delete(assets).where(eq(assets.id, assetId)).returning();

    if (!deletedAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully', deletedAsset });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};