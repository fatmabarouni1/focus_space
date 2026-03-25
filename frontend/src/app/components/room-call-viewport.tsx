import { useRoomCall } from '@/app/context/room-call-context';

export function RoomCallViewport() {
  const { isInRoom, isRoomViewActive, registerVideoContainer, error } = useRoomCall();

  if (!isInRoom && !error) {
    return null;
  }

  const showFull = isInRoom && isRoomViewActive;

  return (
    <div className={showFull ? 'mb-6' : 'pointer-events-none'}>
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div
        ref={registerVideoContainer}
        className={
          showFull
            ? 'h-[560px] w-full overflow-hidden rounded-2xl border border-border bg-muted'
            : 'fixed bottom-0 right-0 h-px w-px opacity-0'
        }
      />
    </div>
  );
}
