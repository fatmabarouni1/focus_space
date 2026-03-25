import { useState } from "react";
import { Music, Play, Pause, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useFocusAudio } from "@/app/hooks/use-focus-audio";

export function CompactMusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastVolume, setLastVolume] = useState(50);
  const {
    sounds,
    activeSoundId,
    isPlaying,
    volume,
    toggleSound,
    pauseSound,
    playSound,
    setVolume,
  } = useFocusAudio();

  const currentAmbience = sounds.find((sound) => sound.id === activeSoundId) ?? null;
  const isMuted = volume === 0;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    if (newVolume > 0) {
      setLastVolume(newVolume);
    }
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(lastVolume || 50);
      return;
    }
    setLastVolume(volume || 50);
    setVolume(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5" style={{ color: "var(--focus-primary)" }} />
                <h4 className="font-medium">Ambiances</h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {sounds.map((ambience) => {
                const isSelected = activeSoundId === ambience.id;
                const isCurrentlyPlaying = isSelected && isPlaying;

                return (
                  <button
                    key={ambience.id}
                    onClick={() => toggleSound(ambience.id)}
                    className={`relative rounded-xl border p-3 text-left transition-all ${
                      isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {isCurrentlyPlaying && (
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-10"
                        style={{ backgroundColor: ambience.color }}
                        animate={{ opacity: [0.05, 0.15, 0.05] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className="relative">
                      <div className="mb-1 text-2xl">{ambience.icon}</div>
                      <div className="text-xs font-medium">{ambience.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentAmbience && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ backgroundColor: `${currentAmbience.color}20` }}
                  >
                    {currentAmbience.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{currentAmbience.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {isPlaying ? "En lecture" : "En pause"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0 rounded-full"
                    onClick={() => {
                      if (isPlaying) {
                        pauseSound();
                      } else if (currentAmbience) {
                        playSound(currentAmbience.id);
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${currentAmbience.color} 0%, ${currentAmbience.color} ${volume}%, var(--muted) ${volume}%, var(--muted) 100%)`,
                    }}
                  />
                  <span className="w-8 flex-shrink-0 text-right text-xs text-muted-foreground">
                    {volume}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative h-14 w-14 overflow-hidden rounded-full shadow-2xl"
        style={{
          backgroundColor: isPlaying && currentAmbience ? currentAmbience.color : "var(--focus-primary)",
        }}
      >
        {isPlaying && currentAmbience ? (
          <>
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="relative z-10 text-2xl">{currentAmbience.icon}</span>
          </>
        ) : (
          <Music className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
