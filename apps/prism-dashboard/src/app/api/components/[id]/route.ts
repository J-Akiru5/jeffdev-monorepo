/**
 * Single Component API
 * 
 * GET    /api/components/[id] - Get component details
 * DELETE /api/components/[id] - Delete component
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCollection } from '@jeffdev/db';

// =============================================================================
// GET - Get Single Component
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  
  try {
    const componentsCollection = await getCollection('components');
    const component = await componentsCollection.findOne({ id, userId });
    
    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: component.id,
      name: component.name,
      description: component.description,
      code: component.code,
      rules: component.rules,
      designSystem: component.designSystem,
      stack: component.stack,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    });
  } catch (error) {
    console.error('[Components] GET single error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Component
// =============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  
  try {
    const componentsCollection = await getCollection('components');
    
    // Verify ownership
    const component = await componentsCollection.findOne({ id, userId });
    
    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    
    await componentsCollection.deleteOne({ id, userId });
    
    return NextResponse.json({ success: true, message: 'Component deleted' });
  } catch (error) {
    console.error('[Components] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete component' },
      { status: 500 }
    );
  }
}
