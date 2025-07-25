use anchor_lang::prelude::*;

use crate::{error::BetError, state::BetState};






#[derive(Accounts)]
pub struct ClaimStruct <'info>{


    #[account(mut)]
    pub signer:Signer<'info>,

    pub creator: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"bet_state", creator.key().as_ref(),bet_state.seed.to_le_bytes().as_ref()],
        bump = bet_state.state_bump,
        has_one = creator @ BetError::InvaildCreator,
     )]
    pub bet_state: Account<'info, BetState>,

    #[account(
    mut,
    seeds = [b"pool_account", creator.key().as_ref(),bet_state.seed.to_le_bytes().as_ref()],
    bump = bet_state.pool_bimp
   )]
    pub pool_account: SystemAccount<'info>,

    // programs
    pub sytem_account: Program<'info, System>,
}


impl <'info> ClaimStruct <'info> {
    

    pub fn claim(&self) -> Result<()>{
        
    }
}


