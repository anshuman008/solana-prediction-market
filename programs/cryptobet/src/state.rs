use anchor_lang::prelude::*;



#[derive(InitSpace)]
#[account(discriminator = 1)]
pub struct  BetState {
 pub creator: Pubkey,
 #[max_len(100)] 
 pub yes_voters: Vec<Pubkey>,
 #[max_len(100)]
 pub no_voters: Vec<Pubkey>,
 pub start_duration: u64,
 pub bet_duration: u64, 
 pub total_transactions: u16,
 pub state_bump: u8,
 pub pool_bimp: u8,
 pub seed: u16
}