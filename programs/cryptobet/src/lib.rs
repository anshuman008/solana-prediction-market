use anchor_lang::prelude::*;
mod instructions;
mod state;
mod error;
declare_id!("3m1GV4daBTk89EESQWsgEqfUfuiknDqbpp1VjwJu9Vxh");

#[program]
pub mod cryptobet {
    use crate::instructions::{bethandlder, claimhandler, create::{createhandler, CreateStruct}, resolvehandler, BetStruct, ClaimStruct, ResolveStruct};

    use super::*;

    pub fn initialize(ctx: Context<CreateStruct>,seed:u16,crypto_target_price:u64, bet_price:u64,bet_duration:u64,betfees:u16  ) -> Result<()> {
      createhandler(ctx, seed, crypto_target_price, bet_price, bet_duration, betfees)?;

      Ok(())
    }


    pub fn bet(ctx:Context<BetStruct>, bet:u8) -> Result<()> {
        
        require!( bet == 0 || bet == 1 , error::InvalidOption);

        bethandlder(ctx, bet)?;

        Ok(())
    }


    pub fn resolve(ctx:Context<ResolveStruct>) -> Result<()>{
           resolvehandler(ctx)?;

           Ok(())
    }


    pub fn claim(ctx:Context<ClaimStruct>) -> Result<()>{
          claimhandler(ctx)?;

          Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize {}
