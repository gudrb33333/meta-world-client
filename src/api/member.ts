import axios from 'axios';

export async function findMe() {
	const { data } = await axios.get('/api/v1/members/me');
	return data;
}
