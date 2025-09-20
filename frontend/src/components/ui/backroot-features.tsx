'use client';
import { Mic, Camera, MapPin, Cloud, Settings, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { FeatureCard } from '@/components/ui/grid-feature-cards';

const backrootFeatures = [
	{
		title: 'Voice AI',
		icon: Mic,
		description: 'Advanced voice processing and real-time conversation capabilities powered by AI.',
	},
	{
		title: 'AR Coins',
		icon: Camera,
		description: 'Augmented reality coin collection system with interactive 3D visualization.',
	},
	{
		title: 'POI Collector',
		icon: MapPin,
		description: 'Discover and collect points of interest with location-based features.',
	},
	{
		title: 'Weather',
		icon: Cloud,
		description: 'Real-time weather data and forecasts integrated with your location.',
	},
	{
		title: 'Settings',
		icon: Settings,
		description: 'Customize your experience with comprehensive configuration options.',
	},
	{
		title: 'AI Powered',
		icon: Sparkles,
		description: 'Everything powered by cutting-edge artificial intelligence technology.',
	},
];

export function BackRootFeatures() {
	return (
		<section className="py-8 md:py-16">
			<div className="mx-auto w-full max-w-5xl px-4">
				<AnimatedContainer
					delay={0.2}
					className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 md:grid-cols-3"
				>
					{backrootFeatures.map((feature, i) => (
						<FeatureCard key={i} feature={feature} />
					))}
				</AnimatedContainer>
			</div>
		</section>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: React.ComponentProps<typeof motion.div>['className'];
	children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}