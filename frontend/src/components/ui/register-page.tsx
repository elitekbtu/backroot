'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import type { RegisterFormData, RegisterRequest } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

import {
	ChevronLeftIcon,
	Grid2x2PlusIcon,
	LockIcon,
	UserIcon,
	UserCheckIcon,
} from 'lucide-react';

export function RegisterPage() {
	const navigate = useNavigate();
	const { register, loading } = useAuth();
	const [formData, setFormData] = useState<RegisterFormData>({
		username: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: ''
	});
	const [error, setError] = useState<string>('');
	const [fieldErrors, setFieldErrors] = useState<Partial<RegisterFormData>>({});
	const [passwordStrength, setPasswordStrength] = useState<{
		score: number;
		label: string;
		color: string;
	}>({ score: 0, label: '', color: '' });

	const calculatePasswordStrength = (password: string) => {
		let score = 0;
		let label = '';
		let color = '';

		if (password.length >= 8) score += 1;
		if (password.length >= 12) score += 1;
		if (/[a-z]/.test(password)) score += 1;
		if (/[A-Z]/.test(password)) score += 1;
		if (/\d/.test(password)) score += 1;
		if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

		if (score <= 2) {
			label = 'Weak';
			color = 'bg-red-500';
		} else if (score <= 4) {
			label = 'Medium';
			color = 'bg-yellow-500';
		} else if (score <= 5) {
			label = 'Strong';
			color = 'bg-blue-500';
		} else {
			label = 'Very Strong';
			color = 'bg-green-500';
		}

		return { score, label, color };
	};

	const validateForm = (): boolean => {
		const errors: Partial<RegisterFormData> = {};
		
		if (!formData.username.trim()) {
			errors.username = 'Username is required';
		} else if (formData.username.length < 3) {
			errors.username = 'Username must be at least 3 characters';
		} else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
			errors.username = 'Username can only contain letters, numbers, and underscores';
		}
		
		if (!formData.firstName.trim()) {
			errors.firstName = 'First name is required';
		} else if (formData.firstName.length < 2) {
			errors.firstName = 'First name must be at least 2 characters';
		}
		
		if (!formData.lastName.trim()) {
			errors.lastName = 'Last name is required';
		} else if (formData.lastName.length < 2) {
			errors.lastName = 'Last name must be at least 2 characters';
		}
		
		if (!formData.password) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
		} else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
			errors.password = 'Password must contain at least one special character';
		}
		
		if (!formData.confirmPassword) {
			errors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev: RegisterFormData) => ({
			...prev,
			[name]: value
		}));
		
		// Update password strength when password changes
		if (name === 'password') {
			setPasswordStrength(calculatePasswordStrength(value));
		}
		
		// Clear field error when user starts typing
		if (fieldErrors[name as keyof RegisterFormData]) {
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

		const registerData: RegisterRequest = {
			username: formData.username,
			password: formData.password,
			first_name: formData.firstName || undefined,
			last_name: formData.lastName || undefined
		};

		try {
			const success = await register(registerData);
			if (success) {
				navigate('/');
			} else {
				setError('Registration failed. Please try again.');
			}
		} catch (error: any) {
			console.error('Registration error:', error);
			
			if (error.response?.status === 409) {
				setError('Username already exists');
			} else if (error.response?.status === 400) {
				setError('Invalid registration data');
			} else if (error.response?.status === 429) {
				setError('Too many attempts. Please try again later.');
			} else if (error.response?.status >= 500) {
				setError('Server error. Please try again later.');
			} else if (error.message === 'Network Error') {
				setError('Network error. Please check your connection.');
			} else {
				setError('Registration failed. Please try again.');
			}
		}
	};

	const handleInputFocus = (fieldName: keyof RegisterFormData) => {
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
							Join Back2Roots!
						</h1>
						<p className="text-muted-foreground text-base">
							Create your Back2Roots account
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
								Enter your information to create an account
							</p>
							
							<div className="relative h-max">
								<Input
									placeholder="Enter username"
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

						<div className="grid grid-cols-2 gap-4">
							<div className="relative h-max">
								<Input
									placeholder="First name"
									className="peer ps-9"
									type="text"
									name="firstName"
									value={formData.firstName}
									onChange={handleInputChange}
									onFocus={() => handleInputFocus('firstName')}
									required
								/>
								<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
									<UserCheckIcon className="size-4" aria-hidden="true" />
								</div>
							</div>
							{fieldErrors.firstName && (
								<p className="text-sm text-destructive">{fieldErrors.firstName}</p>
							)}
							
							<div className="relative h-max">
								<Input
									placeholder="Last name"
									className="peer ps-9"
									type="text"
									name="lastName"
									value={formData.lastName}
									onChange={handleInputChange}
									onFocus={() => handleInputFocus('lastName')}
									required
								/>
								<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
									<UserCheckIcon className="size-4" aria-hidden="true" />
								</div>
							</div>
							{fieldErrors.lastName && (
								<p className="text-sm text-destructive">{fieldErrors.lastName}</p>
							)}
						</div>

						<div className="relative h-max">
							<Input
								placeholder="Enter password"
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
						
						{/* Password Strength Indicator */}
						{formData.password && (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted-foreground">Password strength:</span>
									<span className={`text-xs font-medium ${
										passwordStrength.score <= 2 ? 'text-destructive' :
										passwordStrength.score <= 4 ? 'text-yellow-600' :
										passwordStrength.score <= 5 ? 'text-blue-600' : 'text-green-600'
									}`}>
										{passwordStrength.label}
									</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div 
										className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
										style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
									></div>
								</div>
							</div>
						)}
						
						{fieldErrors.password && (
							<p className="text-sm text-destructive">{fieldErrors.password}</p>
						)}

						<div className="relative h-max">
							<Input
								placeholder="Confirm password"
								className="peer ps-9"
								type="password"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleInputChange}
								onFocus={() => handleInputFocus('confirmPassword')}
								required
							/>
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
								<LockIcon className="size-4" aria-hidden="true" />
							</div>
						</div>
						{fieldErrors.confirmPassword && (
							<p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
						)}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? (
								<div className="flex items-center justify-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Creating account...
								</div>
							) : (
								'Create Account'
							)}
						</Button>
					</form>

					<div className="text-center">
						<Link 
							to="/login" 
							className="text-muted-foreground hover:text-primary text-sm transition-colors"
						>
							Already have an account? Sign in
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