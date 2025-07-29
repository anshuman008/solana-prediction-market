use anchor_lang::prelude::*;
mod instructions;
use instructions::*;
mod state;

mod error;
use error::*;
declare_id!("AM45W68onndPWeuNWY4BDw9vHzoE9buVCNf8nSMkuVZK");

#[program]
pub mod cryptobet {

    use super::*;

    pub fn initialize(ctx: Context<CreateStruct>,seed:u64,crypto_target_price:u64, bet_price:u64,bet_duration:u64,betfees:u16  ) -> Result<()> {
      createhandler(ctx, seed, crypto_target_price, bet_price, bet_duration, betfees)?;

      Ok(())
    }


    pub fn bet(ctx:Context<BetStruct>, bet:u8) -> Result<()> {
        
        require!( bet == 0 || bet == 1 , BetError::InvalidBet);

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
