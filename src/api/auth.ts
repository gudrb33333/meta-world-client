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
	try {
		await axios.post(`/api/v1/auth/signin`, {
			email,
			password,
		});
	} catch (error) {
		if (error.response.status === 403) {
			alert('아이디나 비밀번호가 없습니다.');
		} else {
			alert('알 수 없는 에러로 로그인을 실패했습니다.');
		}
	}
}

export async function logout() {
	try {
		await axios.delete('/api/v1/auth/logout');
	} catch (error) {
		if (error.response.status == 403) {
			alert('이미 로그아웃 되었습니다.');
		}
	}
}
