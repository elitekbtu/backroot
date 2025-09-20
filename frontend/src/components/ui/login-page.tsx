'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import type { LoginFormData, LoginRequest } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

import {
	ChevronLeftIcon,
	Grid2x2PlusIcon,
	LockIcon,
	UserIcon,
} from 'lucide-react';

export function LoginPage() {
	const navigate = useNavigate();
	const { login, loading } = useAuth();
	const [formData, setFormData] = useState<LoginFormData>({
		username: '',
		password: ''
	});
	const [error, setError] = useState<string>('');
	const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormData>>({});

	const validateForm = (): boolean => {
		const errors: Partial<LoginFormData> = {};
		
		if (!formData.username.trim()) {
			errors.username = 'Username is required';
		}
		
		if (!formData.password) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev: LoginFormData) => ({
			...prev,
			[name]: value
		}));
		
		// Clear field error when user starts typing
		if (fieldErrors[name as keyof LoginFormData]) {
			setFieldErrors(prev => ({
				...prev,
				[name]: undefined
			}));
		}
		
		// Clear general error when user starts typing
		if (error) {
			setError('');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		const loginData: LoginRequest = {
			username: formData.username,
			password: formData.password
		};

		try {
			const success = await login(loginData);
			if (success) {
				navigate('/');
			} else {
				setError('Invalid username or password');
			}
		} catch (error: any) {
			console.error('Login error:', error);
			
			if (error.response?.status === 401) {
				setError('Invalid username or password');
			} else if (error.response?.status === 429) {
				setError('Too many attempts. Please try again later.');
			} else if (error.response?.status >= 500) {
				setError('Server error. Please try again later.');
			} else if (error.message === 'Network Error') {
				setError('Network error. Please check your connection.');
			} else {
				setError('Login failed. Please try again.');
			}
		}
	};

	const handleInputFocus = (fieldName: keyof LoginFormData) => {
		// Clear field error on focus
		if (fieldErrors[fieldName]) {
			setFieldErrors(prev => ({
				...prev,
				[fieldName]: undefined
			}));
		}
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
				<div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
				<div className="z-10 flex items-center gap-2">
					<Grid2x2PlusIcon className="size-6" />
					<p className="text-xl font-semibold">Back2Roots</p>
				</div>
				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl">
							&ldquo;This Platform has helped me to save time and explore my
							country faster than ever before.&rdquo;
						</p>
					</blockquote>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>
				<Button variant="ghost" className="absolute top-7 left-5" asChild>
					<Link to="/">
						<ChevronLeftIcon className='size-4 me-2' />
						Home
					</Link>
				</Button>
				<div className="mx-auto space-y-4 sm:w-sm">
					<div className="flex items-center gap-2 lg:hidden">
						<Grid2x2PlusIcon className="size-6" />
						<p className="text-xl font-semibold">Back2Roots</p>
					</div>
					<div className="flex flex-col space-y-1">
						<h1 className="font-heading text-2xl font-bold tracking-wide">
							Welcome Back!
						</h1>
						<p className="text-muted-foreground text-base">
							Sign in to your Back2Roots account
						</p>
					</div>

					{error && (
						<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
							<div className="flex items-center">
								<span className="mr-2">⚠️</span>
								{error}
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<p className="text-muted-foreground text-start text-xs">
								Enter your credentials to sign in
							</p>
							<div className="relative h-max">
								<Input
									placeholder="Enter your username"
									className="peer ps-9"
									type="text"
									name="username"
									value={formData.username}
									onChange={handleInputChange}
									onFocus={() => handleInputFocus('username')}
									required
								/>
								<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
									<UserIcon className="size-4" aria-hidden="true" />
								</div>
							</div>
							{fieldErrors.username && (
								<p className="text-sm text-destructive">{fieldErrors.username}</p>
							)}
						</div>

						<div className="relative h-max">
							<Input
								placeholder="Enter your password"
								className="peer ps-9"
								type="password"
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								onFocus={() => handleInputFocus('password')}
								required
							/>
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
								<LockIcon className="size-4" aria-hidden="true" />
							</div>
						</div>
						{fieldErrors.password && (
							<p className="text-sm text-destructive">{fieldErrors.password}</p>
						)}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? (
								<div className="flex items-center justify-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Signing in...
								</div>
							) : (
								'Sign In'
							)}
						</Button>
					</form>

					<div className="text-center">
						<Link 
							to="/register" 
							className="text-muted-foreground hover:text-primary text-sm transition-colors"
						>
							Don't have an account? Sign up
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}