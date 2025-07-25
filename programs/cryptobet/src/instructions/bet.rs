use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::state::BetState;
use crate::error::BetError;





#[derive(Accounts)]
pub struct BetStruct <'info> {

    #[account(mut)]
    pub signer:Signer<'info>,

    pub creator:SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"bet_state", creator.key().as_ref(),bet_state.seed.to_le_bytes().as_ref()],
        bump = bet_state.state_bump,
        has_one = creator @ BetError::InvaildCreator,
     )]
    pub bet_state:Account<'info,BetState>,

   #[account(
    mut,
    seeds = [b"pool_account", creator.key().as_ref(),bet_state.seed.to_le_bytes().as_ref()],
    bump = bet_state.pool_bimp
   )]
   pub pool_account:SystemAccount<'info>,

   // programs
   pub sytem_account:Program<'info,System>

}


impl <'info> BetStruct <'info>{
    
    pub fn bet(&mut self, bet:u8) -> Result<()>{
      
       require!(self.signer.lamports() > self.bet_state.bet_price, BetError::InvalidAmount);

        transfer(CpiContext::new(self.sytem_account.to_account_info(),
         Transfer { 
            from: self.signer.to_account_info(), 
            to: self.pool_account.to_account_info() 
        }
    ), self.bet_state.bet_price)?;


       if bet == 0 {
        self.bet_state.no_voters.push(self.signer.key());
       }else if bet == 1{
        self.bet_state.yes_voters.push(self.signer.key());
       }

       self.bet_state.total_transactions.checked_add(1).ok_or(BetError::ArithmeticError);


       Ok(())


    }



 
    

}
