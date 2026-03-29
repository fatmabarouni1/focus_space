import { BookOpen, Timer, StickyNote, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { LanguageSelector } from '@/app/components/language-selector';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, var(--focus-primary) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--break-primary) 0%, transparent 50%)',
          }}
        />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          {/* Logo and brand */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="w-32" />
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--focus-light)' }}
            >
              <BookOpen className="h-8 w-8" style={{ color: 'var(--focus-primary)' }} />
            </div>
            <div className="w-32">
              <LanguageSelector />
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl mb-4">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('landing.heroSubtitle')}
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.heroDescription')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                style={{
                  backgroundColor: 'var(--focus-primary)',
                  color: 'white'
                }}
              >
                {t('landing.getStarted')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={onGetStarted}
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6"
              >
                {t('landing.signIn')}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
              {t('landing.freeNote')}
            </p>
          </div>

          {/* Preview card */}
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 shadow-2xl border-2">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="h-3 bg-muted rounded-full" />
                <div className="h-3 bg-muted rounded-full col-span-2" />
              </div>
              <div className="text-center mb-6">
                <div 
                  className="text-6xl mb-4 inline-block"
                  style={{ color: 'var(--focus-primary)' }}
                >
                  25:00
                </div>
                <div className="h-2 bg-muted rounded-full max-w-md mx-auto">
                  <div 
                    className="h-full w-1/3 rounded-full"
                    style={{ backgroundColor: 'var(--focus-primary)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-muted rounded-lg" />
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--focus-light)' }}
              >
                <Timer className="h-6 w-6" style={{ color: 'var(--focus-primary)' }} />
              </div>
              <h3 className="mb-2">{t('landing.featureTimerTitle')}</h3>
              <p className="text-muted-foreground">
                {t('landing.featureTimerDescription')}
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--success-light)' }}
              >
                <StickyNote className="h-6 w-6" style={{ color: 'var(--success)' }} />
              </div>
              <h3 className="mb-2">{t('landing.featureNotesTitle')}</h3>
              <p className="text-muted-foreground">
                {t('landing.featureNotesDescription')}
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--break-light)' }}
              >
                <Users className="h-6 w-6" style={{ color: 'var(--break-primary)' }} />
              </div>
              <h3 className="mb-2">{t('landing.featureRoomsTitle')}</h3>
              <p className="text-muted-foreground">
                {t('landing.featureRoomsDescription')}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: 'var(--focus-light)' }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--focus-primary)' }} />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('landing.benefitOneTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.benefitOneDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: 'var(--focus-light)' }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--focus-primary)' }} />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('landing.benefitTwoTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.benefitTwoDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: 'var(--focus-light)' }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--focus-primary)' }} />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('landing.benefitThreeTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.benefitThreeDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-8 bg-gradient-to-br from-muted/50 to-muted/20">
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="text-5xl mb-2"
                      style={{ color: 'var(--focus-primary)' }}
                    >
                      25
                    </div>
                    <p className="text-sm text-muted-foreground">{t('landing.deepFocusMinutes')}</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-5xl mb-2"
                      style={{ color: 'var(--break-primary)' }}
                    >
                      5
                    </div>
                    <p className="text-sm text-muted-foreground">{t('landing.rechargeMinutes')}</p>
                  </div>
                  <div className="text-center pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {t('landing.pomodoroNote')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl">{t('landing.ctaTitle')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="text-lg px-8 py-6 shadow-lg"
                style={{
                  backgroundColor: 'var(--focus-primary)',
                  color: 'white'
                }}
              >
                {t('landing.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--focus-light)' }}
              >
                <BookOpen className="h-4 w-4" style={{ color: 'var(--focus-primary)' }} />
              </div>
              <span className="font-medium">{t('app.brand')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('app.tagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
