import axios from 'axios';

export interface ProfileProps {
    nickname: string;
    publicType: string;
    avatarUrl: string;
}

export async function createProfile(profileProps: ProfileProps) {
    const { nickname, publicType, avatarUrl } = profileProps;
    try {
        const data = await axios.post('/api/v1/profiles', {
            nickname: nickname,
            publicType: publicType,
            avatarUrl: avatarUrl,
        });

        return data;
    } catch(error) {
        if (error.response.status === 403) {
            alert('권한이 없습니다. 다시 로그인 해주세요.');
        } else {
            alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
        }
    }
}