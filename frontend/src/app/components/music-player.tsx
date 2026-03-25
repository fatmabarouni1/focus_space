import { useState, useEffect, useRef } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Ambience {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  // Pour le MVP, nous utilisons des sons générés ou des URLs de demo
  audioUrl?: string;
}

const ambiences: Ambience[] = [
  {
    id: 'lofi',
    name: 'Lo-fi Beats',
    icon: '🎵',
    color: '#8B5CF6',
    description: 'Rythmes doux et relaxants',
  },
  {
    id: 'rain',
    name: 'Pluie douce',
    icon: '🌧️',
    color: '#3B82F6',
    description: 'Sons apaisants de la pluie',
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿',
    color: '#10B981',
    description: 'Oiseaux et forêt',
  },
  {
    id: 'cafe',
    name: 'Café ambiant',
    icon: '☕',
    color: '#F59E0B',
    description: 'Ambiance de café cosy',
  },
  {
    id: 'ocean',
    name: 'Vagues océan',
    icon: '🌊',
    color: '#06B6D4',
    description: 'Ressac apaisant',
  },
  {
    id: 'white-noise',
    name: 'Bruit blanc',
    icon: '🔇',
    color: '#6B7280',
    description: 'Isolation sonore',
  },
];

export function MusicPlayer() {
  const [selectedAmbience, setSelectedAmbience] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Charger les préférences sauvegardées
    const savedAmbience = localStorage.getItem('focusspace_music_ambience');
    const savedVolume = localStorage.getItem('focusspace_music_volume');
    
    if (savedVolume) {
      setVolume(Number(savedVolume));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleSelectAmbience = (ambienceId: string) => {
    if (selectedAmbience === ambienceId && isPlaying) {
      // Si on clique sur l'ambiance en cours, on met en pause
      setIsPlaying(false);
    } else {
      setSelectedAmbience(ambienceId);
      setIsPlaying(true);
      localStorage.setItem('focusspace_music_ambience', ambienceId);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    localStorage.setItem('focusspace_music_volume', String(newVolume));
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const currentAmbience = ambiences.find(a => a.id === selectedAmbience);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--focus-light)' }}
        >
          <Music className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />
        </div>
        <div>
          <h3>Ambiances sonores</h3>
          <p className="text-sm text-muted-foreground">Musique pour la concentration</p>
        </div>
      </div>

      {/* Grille d'ambiances */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {ambiences.map((ambience) => {
          const isSelected = selectedAmbience === ambience.id;
          const isCurrentlyPlaying = isSelected && isPlaying;

          return (
            <motion.button
              key={ambience.id}
              onClick={() => handleSelectAmbience(ambience.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animation de lecture */}
              {isCurrentlyPlaying && (
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: ambience.color }}
                  animate={{
                    opacity: [0.05, 0.15, 0.05],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              <div className="relative">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{ambience.icon}</span>
                  {isCurrentlyPlaying && (
                    <motion.div
                      className="flex items-center gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 rounded-full"
                          style={{ backgroundColor: ambience.color }}
                          animate={{
                            height: ['8px', '16px', '8px'],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{ambience.name}</h4>
                <p className="text-xs text-muted-foreground">{ambience.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Contrôles de lecture */}
      <AnimatePresence mode="wait">
        {selectedAmbience && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border pt-4"
          >
            {/* Info piste actuelle */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: currentAmbience?.color + '20' }}
              >
                {currentAmbience?.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{currentAmbience?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {isPlaying ? 'En cours de lecture' : 'En pause'}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>

            {/* Contrôle du volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Volume</Label>
                <span className="text-sm text-muted-foreground">{isMuted ? 0 : volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${currentAmbience?.color} 0%, ${currentAmbience?.color} ${volume}%, var(--muted) ${volume}%, var(--muted) 100%)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message info pour le MVP */}
      {!selectedAmbience && (
        <div className="text-center py-6 px-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Sélectionnez une ambiance pour commencer
          </p>
        </div>
      )}

      {/* Note technique */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        💡 Connectez votre playlist préférée en arrière-plan pour une expérience complète
      </p>
    </Card>
  );
}

// Composant Label simple
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
