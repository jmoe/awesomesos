import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { TripDisplay } from './TripDisplay'

export default async function TripPage({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params
  const supabase = await createClient()

  // Fetch trip data
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_id', shareId)
    .single()

  if (error || !trip) {
    notFound()
  }

  // Increment view count
  await supabase.rpc('increment_trip_views', { trip_share_id: shareId })

  return <TripDisplay trip={trip} />
}