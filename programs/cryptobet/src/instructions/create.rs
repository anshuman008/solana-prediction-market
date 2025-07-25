use anchor_lang::prelude::*;
use crate::state::BetState;




#[derive(Accounts)]
#[instruction(seed:u16)]
pub struct CreateStruct <'info> {

    #[account(mut)]
    pub signer:Signer<'info>,

     #[account(
        init,
        payer = signer,
        space = BetState::INIT_SPACE + BetState::DISCRIMINATOR.len(),
        seeds = [b"bet_state", signer.key().as_ref(),seed.to_le_bytes().as_ref()],
        bump
     )]
     pub bet_state:Account<'info,BetState>,

     #[account(
        mut,
        seeds = [b"pool_account", signer.key().as_ref(),seed.to_le_bytes().as_ref()],
        bump
     )]
     pub pool_account:SystemAccount<'info>,

     pub system_program:Program<'info,System>
}

