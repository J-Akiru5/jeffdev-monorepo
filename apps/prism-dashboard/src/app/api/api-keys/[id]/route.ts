/**
 * API Key Revocation
 * 
 * DELETE /api/api-keys/[id] - Revoke an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCollection } from '@jeffdev/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }
    
    const apiKeysCollection = await getCollection('apiKeys');
    
    // Find the key and verify ownership
    const existingKey = await apiKeysCollection.findOne({ id, userId });
    
    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    
    if (existingKey.revokedAt) {
      return NextResponse.json({ error: 'API key is already revoked' }, { status: 400 });
    }
    
    // Soft delete - mark as revoked
    await apiKeysCollection.updateOne(
      { id, userId },
      { $set: { revokedAt: new Date().toISOString() } }
    );
    
    return NextResponse.json({
      success: true,
      message: 'API key has been revoked',
    });
    
  } catch (error) {
    console.error('[API Keys] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
