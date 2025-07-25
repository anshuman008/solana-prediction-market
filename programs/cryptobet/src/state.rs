use anchor_lang::prelude::*;



#[derive(InitSpace)]
#[account(discriminator = 1)]
pub struct  BetState {
 pub creator: Pubkey,
 pub bet_price: u64,
 pub crypto_start_price: u64,
 pub crypto_traget_price: u64,
 #[max_len(100)] 
 pub yes_voters: Vec<Pubkey>,
 #[max_len(100)]
 pub no_voters: Vec<Pubkey>,
 pub is_active: bool,
 pub winner_side: i8,
 pub start_duration: u64,
 pub bet_duration: u64, 
 pub total_transactions: u16,
 pub state_bump: u8,
 pub pool_bump: u8,
 pub betfees: u16,
 pub seed: u16
}


#[derive(InitSpace)]
#[account(discriminator = 1)]
pub struct UserClaim {
    pub user: Pubkey,           // Who owns this claim
    pub bet_market: Pubkey,     // Which market this is for
    pub claimed: bool,          // Has user claimed yet?
    pub amount: u64,            // How much they can claim
    pub claim_timestamp: i64,   // When they claimed
    pub bump: u8,               // PDA bump
}