import axios from 'axios';

export interface ProfileProps {
    nickname: string;
    publicType: string;
    avatarUrl: string;
}

export async function createProfile(profileProps: ProfileProps) {
    const { nickname, publicType, avatarUrl } = profileProps;

    await axios.post('/api/v1/profiles', {
        nickname: nickname,
        publicType: publicType,
        avatarUrl: avatarUrl,
    });
} 

export async function findMyProfile() {
    const { data }  = await axios.get('/api/v1/profiles/me');
    return data;
}

export async function updateProfile(profileProps: ProfileProps) {
    const { nickname, publicType, avatarUrl } = profileProps;

    const { data } = await axios.patch('/api/v1/profiles/me', {
        nickname: nickname,
        publicType: publicType,
        avatarUrl: avatarUrl,
    });

    return data;
}

export async function deleteProfile() {
    await axios.delete('/api/v1/profiles/me');
}
