import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { BackRootFooter } from '@/components/ui/backroot-footer';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Mic, Camera, Cloud } from 'lucide-react';

const Hero: React.FC = () => {
  const words = ["Back", "Root"];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 25,
      },
    },
  };

  const featureVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 25,
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Paths Component - only paths, no content */}
        <BackgroundPaths showContent={false} />
        
        {/* Custom Content Overlay */}
        <motion.div 
          className="relative z-10 container mx-auto px-4 md:px-6 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
            <div className="max-w-5xl mx-auto">
              {/* Animated Title */}
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter">
                  {words.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className="inline-block mr-6 last:mr-0"
                    >
                      {word.split("").map((letter, letterIndex) => (
                        <motion.span
                          key={`${wordIndex}-${letterIndex}`}
                          initial={{ y: 100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            delay: wordIndex * 0.1 + letterIndex * 0.05,
                            type: "spring" as const,
                            stiffness: 150,
                            damping: 25,
                          }}
                          className="inline-block text-transparent bg-clip-text 
                          bg-gradient-to-r from-foreground to-foreground/70 
                          dark:from-foreground dark:to-foreground/80"
                        >
                          {letter}
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </h1>
              </motion.div>
              
              {/* Subtitle */}
              <motion.p 
                variants={itemVariants}
                className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                AI-powered voice and video platform for seamless communication
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
              >
                <div className="inline-block group relative bg-gradient-to-b from-background/10 to-background/5 
                              dark:from-foreground/10 dark:to-foreground/5 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                             bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 
                             group-hover:-translate-y-0.5 border border-primary/20
                             hover:shadow-lg dark:hover:shadow-primary/25"
                  >
                    <Link to="/register">
                      <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                        Get Started
                      </span>
                      <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                     transition-all duration-300">
                        →
                      </span>
                    </Link>
                  </Button>
                </div>
                
                <div className="inline-block group relative bg-gradient-to-b from-background/10 to-background/5 
                              dark:from-foreground/10 dark:to-foreground/5 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                             bg-background/95 hover:bg-background/100 dark:bg-background/95 dark:hover:bg-background/100 
                             transition-all duration-300 group-hover:-translate-y-0.5 
                             border border-border/50 hover:border-border
                             hover:shadow-lg dark:hover:shadow-foreground/10"
                  >
                    <Link to="/login">
                      <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                        Learn More
                      </span>
                    </Link>
                  </Button>
                </div>
              </motion.div>
              
              {/* Features Grid */}
              <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              >
                {[
                  {
                    icon: <Mic className="w-8 h-8 text-blue-500" />,
                    title: "Voice Processing",
                    description: "Advanced AI voice recognition and synthesis"
                  },
                  {
                    icon: <Camera className="w-8 h-8 text-green-500" />,
                    title: "Video Generation", 
                    description: "Create videos with AI assistance"
                  },
                  {
                    icon: <Cloud className="w-8 h-8 text-cyan-500" />,
                    title: "Weather Integration",
                    description: "Real-time weather data and forecasts"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={featureVariants}
                    whileHover={{ 
                      y: -5,
                      transition: { type: "spring" as const, stiffness: 300, damping: 20 }
                    }}
                    className="group relative rounded-2xl"
                  >
                    <div className="relative h-full rounded-2xl border border-border/50 p-2">
                      <GlowingEffect
                        spread={30}
                        glow={true}
                        disabled={false}
                        proximity={80}
                        inactiveZone={0.3}
                        borderWidth={2}
                        movementDuration={1.5}
                      />
                      <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-sm group-hover:bg-card/80 transition-all duration-300">
                        <div className="relative flex flex-1 flex-col justify-between gap-4">
                        <div className="w-fit rounded-lg border border-border/50 bg-muted/50 p-3 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-card-foreground">
                              {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
      </div>
      
      {/* Footer */}
      <BackRootFooter />
    </div>
  );
};

export default Hero;