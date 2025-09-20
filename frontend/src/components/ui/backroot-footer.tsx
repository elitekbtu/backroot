import {
	FacebookIcon,
	GithubIcon,
	Grid2X2Plus,
	InstagramIcon,
	LinkedinIcon,
	TwitterIcon,
	YoutubeIcon,
	Mic,
	Video,
	Cloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackRootFooter() {
	const year = new Date().getFullYear();

	const company = [
		{
			title: 'About Us',
			href: '#',
		},
		{
			title: 'Careers',
			href: '#',
		},
		{
			title: 'Brand assets',
			href: '#',
		},
		{
			title: 'Privacy Policy',
			href: '#',
		},
		{
			title: 'Terms of Service',
			href: '#',
		},
	];

	const resources = [
		{
			title: 'Blog',
			href: '#',
		},
		{
			title: 'Help Center',
			href: '#',
		},
		{
			title: 'Contact Support',
			href: 'mailto:support@backroot.com',
		},
		{
			title: 'Community',
			href: '#',
		},
		{
			title: 'Security',
			href: '#',
		},
	];

	const features = [
		{
			title: 'Voice AI',
			href: '/dashboard/v2v',
			icon: <Mic className="size-4" />,
		},
		{
			title: 'AR Coins',
			href: '/dashboard/ar',
			icon: <Video className="size-4" />,
		},
		{
			title: 'Weather',
			href: '/dashboard/weather',
			icon: <Cloud className="size-4" />,
		},
	];

	const socialLinks = [
		{
			icon: <FacebookIcon className="size-4" />,
			link: '#',
		},
		{
			icon: <GithubIcon className="size-4" />,
			link: '#',
		},
		{
			icon: <InstagramIcon className="size-4" />,
			link: '#',
		},
		{
			icon: <LinkedinIcon className="size-4" />,
			link: '#',
		},
		{
			icon: <TwitterIcon className="size-4" />,
			link: '#',
		},
		{
			icon: <YoutubeIcon className="size-4" />,
			link: '#',
		},
	];

	return (
		<footer className="relative">
			<div className="bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-foreground/.1),transparent)] mx-auto max-w-4xl md:border-x">
				<div className="bg-border absolute inset-x-0 h-px w-full" />
				<div className="grid max-w-4xl grid-cols-6 gap-6 p-4">
					<div className="col-span-6 flex flex-col gap-5 md:col-span-3">
						<Link to="/" className="w-max opacity-25">
							<Grid2X2Plus className="size-8" />
						</Link>
						<div className="flex items-center gap-2">
							<h3 className="text-xl font-medium text-foreground">
								Back<span className="font-normal">Root</span>
							</h3>
						</div>
						<p className="text-muted-foreground max-w-sm font-mono text-sm text-balance">
							AI-powered voice and video platform for seamless communication
						</p>
						<div className="flex gap-2">
							{socialLinks.map((item, i) => (
								<a
									key={i}
									className="hover:bg-accent rounded-md border p-1.5"
									target="_blank"
									href={item.link}
								>
									{item.icon}
								</a>
							))}
						</div>
					</div>
					<div className="col-span-3 w-full md:col-span-1">
						<span className="text-muted-foreground mb-1 text-xs">
							Features
						</span>
						<div className="flex flex-col gap-1">
							{features.map(({ href, title, icon }, i) => (
								<Link
									key={i}
									className="w-max py-1 text-sm duration-200 hover:underline flex items-center gap-2"
									to={href}
								>
									{icon}
									{title}
								</Link>
							))}
						</div>
					</div>
					<div className="col-span-3 w-full md:col-span-1">
						<span className="text-muted-foreground mb-1 text-xs">
							Resources
						</span>
						<div className="flex flex-col gap-1">
							{resources.map(({ href, title }, i) => (
								<a
									key={i}
									className="w-max py-1 text-sm duration-200 hover:underline"
									href={href}
								>
									{title}
								</a>
							))}
						</div>
					</div>
					<div className="col-span-3 w-full md:col-span-1">
						<span className="text-muted-foreground mb-1 text-xs">Company</span>
						<div className="flex flex-col gap-1">
							{company.map(({ href, title }, i) => (
								<a
									key={i}
									className="w-max py-1 text-sm duration-200 hover:underline"
									href={href}
								>
									{title}
								</a>
							))}
						</div>
					</div>
				</div>
				<div className="bg-border absolute inset-x-0 h-px w-full" />
				<div className="flex max-w-4xl flex-col justify-between gap-2 pt-2 pb-5">
					<p className="text-muted-foreground text-center font-thin">
						© <a href="https://backroot.com" className="hover:underline">BackRoot</a>. All rights
						reserved {year}
					</p>
				</div>
			</div>
		</footer>
	);
}