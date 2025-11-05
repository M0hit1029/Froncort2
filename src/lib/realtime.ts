/**
 * Realtime messaging abstraction layer
 * 
 * Provides a unified interface for realtime project events.
 * Uses BroadcastChannel for local multi-tab sync (fallback).
 * Can be extended to use Supabase channels when available.
 */

// Event types for different project activities
export type EventType = 
  | 'kanban:card:move'
  | 'kanban:card:add'
  | 'kanban:card:update'
  | 'kanban:board:add'
  | 'document:update'
  | 'activity:log';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface RealtimeEvent<T = any> {
  projectId: string;
  eventType: EventType;
  payload: T;
  timestamp: number;
  userId?: string;
}

export type EventCallback = (event: RealtimeEvent) => void;

interface Subscription {
  projectId: string;
  callback: EventCallback;
  channel?: BroadcastChannel;
}

class RealtimeService {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private channels: Map<string, BroadcastChannel> = new Map();
  private isSupabaseAvailable = false;

  constructor() {
    // Check if Supabase is available
    this.checkSupabaseAvailability();
  }

  private checkSupabaseAvailability() {
    // In the future, check for Supabase client here
    // For now, we'll use BroadcastChannel fallback
    this.isSupabaseAvailable = false;
  }

  /**
   * Subscribe to realtime events for a specific project
   * @param projectId The project ID to subscribe to
   * @param onEvent Callback function to handle events
   * @returns Unsubscribe function
   */
  subscribeToProject(projectId: string, onEvent: EventCallback): () => void {
    if (this.isSupabaseAvailable) {
      return this.subscribeViaSupabase(projectId, onEvent);
    } else {
      return this.subscribeViaBroadcastChannel(projectId, onEvent);
    }
  }

  /**
   * Emit a project event to all subscribers
   * @param projectId The project ID
   * @param eventType Type of the event
   * @param payload Event payload data
   * @param userId Optional user ID who triggered the event
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitProjectEvent(projectId: string, eventType: EventType, payload: any, userId?: string): void {
    const event: RealtimeEvent = {
      projectId,
      eventType,
      payload,
      timestamp: Date.now(),
      userId,
    };

    if (this.isSupabaseAvailable) {
      this.emitViaSupabase(event);
    } else {
      this.emitViaBroadcastChannel(event);
    }
  }

  // BroadcastChannel implementation (fallback for local multi-tab sync)
  private subscribeViaBroadcastChannel(projectId: string, onEvent: EventCallback): () => void {
    // Check if BroadcastChannel is available (not available in some environments like Node.js)
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel is not available in this environment');
      return () => {};
    }

    const channelName = `project-${projectId}`;
    let channel = this.channels.get(channelName);

    // Create channel if it doesn't exist
    if (!channel) {
      channel = new BroadcastChannel(channelName);
      this.channels.set(channelName, channel);
    }

    // Create subscription
    const subscription: Subscription = {
      projectId,
      callback: onEvent,
      channel,
    };

    // Add to subscriptions
    const projectSubscriptions = this.subscriptions.get(projectId) || [];
    projectSubscriptions.push(subscription);
    this.subscriptions.set(projectId, projectSubscriptions);

    // Set up message listener
    const messageHandler = (event: MessageEvent<RealtimeEvent>) => {
      if (event.data && event.data.projectId === projectId) {
        onEvent(event.data);
      }
    };

    channel.addEventListener('message', messageHandler);

    // Return unsubscribe function
    return () => {
      channel?.removeEventListener('message', messageHandler);
      
      // Remove from subscriptions
      const subs = this.subscriptions.get(projectId) || [];
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
      
      // Clean up channel if no more subscriptions
      if (subs.length === 0) {
        channel?.close();
        this.channels.delete(channelName);
        this.subscriptions.delete(projectId);
      }
    };
  }

  private emitViaBroadcastChannel(event: RealtimeEvent): void {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channelName = `project-${event.projectId}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = new BroadcastChannel(channelName);
      this.channels.set(channelName, channel);
    }

    channel.postMessage(event);
  }

  // Supabase implementation (for future use)
  private subscribeViaSupabase(_projectId: string, _onEvent: EventCallback): () => void {
    // TODO: Implement Supabase realtime subscription
    // const channel = supabase.channel(`project:${projectId}`)
    //   .on('broadcast', { event: '*' }, (payload) => {
    //     onEvent(payload as RealtimeEvent);
    //   })
    //   .subscribe();
    // 
    // return () => {
    //   supabase.removeChannel(channel);
    // };
    
    console.warn('Supabase realtime not yet implemented');
    return () => {};
  }

  private emitViaSupabase(_event: RealtimeEvent): void {
    // TODO: Implement Supabase realtime broadcast
    // supabase.channel(`project:${event.projectId}`)
    //   .send({
    //     type: 'broadcast',
    //     event: event.eventType,
    //     payload: event,
    //   });
    
    console.warn('Supabase realtime not yet implemented');
  }

  /**
   * Clean up all subscriptions and channels
   */
  cleanup(): void {
    // Close all BroadcastChannels
    this.channels.forEach((channel) => {
      channel.close();
    });
    
    this.channels.clear();
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export convenience functions
export const subscribeToProject = realtimeService.subscribeToProject.bind(realtimeService);
export const emitProjectEvent = realtimeService.emitProjectEvent.bind(realtimeService);
