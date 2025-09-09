export interface Coin {
  id: number;
  name: string;
  symbol: string;
  description: string;
  ar_model_url: string;
  ar_scale: number;
  ar_position_x: number;
  ar_position_y: number;
  ar_position_z: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoinList {
  coins: Coin[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CoinResponse {
  id: number;
  name: string;
  symbol: string;
  description: string;
  ar_model_url: string;
  ar_scale: number;
  ar_position_x: number;
  ar_position_y: number;
  ar_position_z: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}   
export interface CoinCreate {
  name: string;
  symbol: string;
  description?: string;
  ar_model_url?: string;
  ar_scale?: number;
  ar_position_x?: number;
  ar_position_y?: number;
  ar_position_z?: number;
}
export interface CoinUpdate {
  name?: string;
  symbol?: string;
  description?: string;
  ar_model_url?: string;
  ar_scale?: number;
  ar_position_x?: number;
  ar_position_y?: number;
  ar_position_z?: number;
  is_active?: boolean;
}   

export interface CoinDelete {   
  id: number;
}   

export interface CoinSearch {
  query: string;
}   

export interface CoinFilter {
  is_active: boolean;
}   
