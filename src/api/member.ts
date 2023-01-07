import axios from 'axios';

export async function findMe() {
    try{
        const { data } = await axios.get('/api/v1/members/me');
        return data;
    } catch(error) {
        if (error.response.status == 403) {
            alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');
        } else {
            alert('알 수 없는 에러가 발생했습니다.');
        }
    }
}
