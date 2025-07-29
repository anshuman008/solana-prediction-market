use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use crate::state::BetState;
use crate::error::BetError;





#[derive(Accounts)]
pub struct ResolveStruct<'info> {

    #[account(mut)]
    pub signer:Signer<'info>,

    pub creator: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"bet_state", creator.key().as_ref(),bet_state.seed.to_le_bytes().as_ref()],
        bump
     )]
     pub bet_state:Account<'info,BetState>,

     pub pyth_price_feed: Account<'info, PriceUpdateV2>,

     pub system_program:Program<'info,System>,
}



impl <'info> ResolveStruct <'info> {
    
    pub fn resolve(&mut self) -> Result<()> {
       
       require!(self.bet_state.is_active != false, BetError::BetClosed);
       
       let clock = Clock::get()?;
       let current_time = clock.unix_timestamp as u64;

       let duration_passed = current_time - self.bet_state.start_duration;

       require!(duration_passed > self.bet_state.bet_duration,BetError::BetInProgress);
 
       
        let price_update = &mut self.pyth_price_feed;
        let maximum_age: u64 = 300;

          // btc/usd
        let feed_id: [u8; 32] = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
        let price: pyth_solana_receiver_sdk::price_update::Price = price_update.get_price_no_older_than(&clock, maximum_age, &feed_id)?;


         msg!("The price is ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);

         let crypto_current_price = (price.price as f64 * 10f64.powi(price.exponent)) as u64;


         if crypto_current_price >= self.bet_state.crypto_traget_price {

            self.bet_state.winner_side = 1;
         }
         else {
             self.bet_state.winner_side = 0;
         }

         self.bet_state.is_active = false;

         Ok(())
     }
}



  pub fn resolvehandler(ctx:Context<ResolveStruct>) -> Result<()>{
     ctx.accounts.resolve()?;

     Ok(())
  }