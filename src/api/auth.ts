import axios from 'axios';

export interface SignupProps {
	email: string;
	password: string;
}

export interface LoginProps {
	email: string;
	password: string;
}

export async function signup(signupProps: SignupProps) {
	const { email, password } = signupProps;

	await axios.post('/api/v1/auth/signup', {
		email,
		password,
	});
}

export async function signin(loginProps: LoginProps) {
	const { email, password } = loginProps;

	await axios.post(`/api/v1/auth/signin`, {
		email,
		password,
	});
}

export async function logout() {
	await axios.delete('/api/v1/auth/logout');
}
