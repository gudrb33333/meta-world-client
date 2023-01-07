import axios from 'axios';

export interface ClothingProps {
    uuid: string;
}

export async function findClothing(clothingProps: ClothingProps) {
    const { uuid } = clothingProps;
    const { data } = await axios.get('/api/v1/clothing/' + uuid);
    return data;
}
