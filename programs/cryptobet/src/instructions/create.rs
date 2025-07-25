use anchor_lang::prelude::*;
use crate::state::BetState;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
const STALENESS_THRESHOLD: u64 = 60; // staleness threshold in seconds



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

     pub pyth_price_feed: Account<'info, PriceUpdateV2>,

     pub system_program:Program<'info,System>,


}


impl <'info> CreateStruct <'info> {
    

    pub fn initialize(&mut self,seed:u16,crypto_target_price:u64, bet_price:u16,bet_duration:u64,state_bump:u8,pool_bimp:u8 ) -> Result<()>{

         let clock = Clock::get()?;
         let current_time = clock.unix_timestamp as u64;


          let price_update = &mut self.pyth_price_feed;
          let maximum_age: u64 = 30;

          // btc/usd
         let feed_id: [u8; 32] = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
        let price = price_update.get_price_no_older_than(&clock, maximum_age, &feed_id)?;


         msg!("The price is ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);

        self.bet_state.set_inner(BetState {
             creator: self.signer.key(),
             bet_price: bet_price,
             crypto_traget_price:price.price as u64,
            //  crypto_traget_price: crypto_target_price,
             yes_voters: [].to_vec(),
             no_voters: [].to_vec(), 
             start_duration: current_time,
             bet_duration: bet_duration, 
             total_transactions: 0, 
             state_bump: state_bump, 
             pool_bimp: pool_bimp, 
             seed: seed 
            });


            Ok(())
    }



}