export interface EvmChainsData {
    chain_id: number;
    chain_name: string;
    color: string;
    explorer: {
        name: string;
        urL: string;
        icon: string;
        block_path: string;
        address_path: string;
    };
    gateway_address: string;
    id: string;
    image: string;
    maintainer_id: string;
    name: string;
    provider_params: any;
    short_name: string;
    website: string;
}