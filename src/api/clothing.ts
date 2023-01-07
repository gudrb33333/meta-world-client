import axios from 'axios';

export interface ClothingProps {
    uuid: string;
}

export async function findClothing(clothingProps: ClothingProps) {
    const { uuid } = clothingProps;
    try {
        const { data } = await axios.get('/api/v1/clothing/' + uuid);
        return data;
    } catch(error) {
        if (error.response.status === 404) {
            alert('의상 정보가 없습니다.');
        } else if (error.response.status === 403) {
            alert('자산에 접근 권한이 없습니다. 로그인 해주세요.');
        } else {
            alert('알 수 없는 에러가 발생했습니다.');
        }
    }
}
