import axios from 'axios';

export interface ProfileProps {
    nickname: string;
    publicType: string;
    avatarUrl: string;
}

export async function createProfile(profileProps: ProfileProps) {
    const { nickname, publicType, avatarUrl } = profileProps;
    try {
        return await axios.post('/api/v1/profiles', {
            nickname: nickname,
            publicType: publicType,
            avatarUrl: avatarUrl,
        });
    } catch(error) {
        if (error.response.status === 403) {
            alert('권한이 없습니다. 다시 로그인 해주세요.');
        } else {
            alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
        }
    }
}

export async function findMyProfile() {
    try {
        const { data }  = await axios.get('/api/v1/profiles/me');
        return data;
    } catch(error) {
        if (error.response.status === 403) {
            alert('권한이 없습니다. 다시 로그인 해주세요.');
        } else if (error.response.status === 404) {
            alert('이미 생성된 프로필이 없습니다. 프로필을 먼저 생성해 주세요.');
        } else {
            alert('알 수 없는 에러로 프로필 조회를 실패했습니다.');
        }
    }
}

export async function updateProfile(profileProps: ProfileProps) {
    const { nickname, publicType, avatarUrl } = profileProps;
    try {
        const { data } = await axios.patch('/api/v1/profiles/me', {
            nickname: nickname,
            publicType: publicType,
            avatarUrl: avatarUrl,
        });

        return data;
    } catch (error) {
        if (error.response.status === 403) {
            alert('권한이 없습니다. 다시 로그인 해주세요.');
        } else if (error.response.status === 404) {
            alert('프로필이 없습니다. 프로필을 먼저 생성 해주세요.');
        } else {
            alert('알 수 없는 에러로 아바타 생성을 실패했습니다.');
        }
    }
}

export async function deleteProfile() {
    try {
        const { data } = await axios.delete('/api/v1/profiles/me');
        return data;
    } catch (error) {
        if (error.response.status === 404) {
            alert('삭제할 프로필을 찾지 못했습니다.');
        } else if (error.response.status === 403) {
            alert('권한이 없습니다. 로그인을 다시 해주세요.');
        } else {
            alert('알 수 없는 에러가 발생했습니다.');
        }
    }
}
