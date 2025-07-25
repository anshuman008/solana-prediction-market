use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use crate::{error::BetError, state::BetState, state::UserClaim};




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
    bump = bet_state.pool_bump
   )]
    pub pool_account: SystemAccount<'info>,


    #[account(
        init,
        payer = signer,
        space = UserClaim::INIT_SPACE + UserClaim::DISCRIMINATOR.len(),
        seeds = [
            b"claim",
            signer.key.as_ref(),
            bet_state.key().as_ref(),
            ],
            bump
    )]
    pub claim_account:Account<'info,UserClaim>,

    // programs
    pub system_program: Program<'info, System>,
}


impl <'info> ClaimStruct <'info> {
    

    pub fn claim_winnings(&mut self, claim_bump:u8) -> Result<()> {
         
         require!(self.bet_state.is_active == false, BetError::BetInProgress);
         require!(self.bet_state.winner_side != -1,BetError::BetInProgress);


       let is_winner = if self.bet_state.winner_side == 1 {
        self.bet_state.yes_voters.contains(&self.signer.key())
        } else {
        self.bet_state.no_voters.contains(&self.signer.key())
       };

      require!(is_winner, BetError::NotWinner);


       let total_winners = if self.bet_state.winner_side == 1 {
        self.bet_state.yes_voters.len()
        } else {
        self.bet_state.no_voters.len()
       } as u64;

       let user_share = self.pool_account.lamports() / total_winners;
       

        self.claim_account.user = self.signer.key();
        self.claim_account.bet_market = self.bet_state.key();
        self.claim_account.claimed = true;
        self.claim_account.amount = user_share;
        self.claim_account.claim_timestamp = Clock::get()?.unix_timestamp;
        self.claim_account.bump = claim_bump;

        

        let signer_seed: &[&[&[u8]]] = &[&[
            b"pool_account",
            self.bet_state.creator.as_ref(),
            &self.bet_state.seed.to_le_bytes()[..],
            &[self.bet_state.pool_bump]
        ]];


        transfer(
            CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                 Transfer { 
                     from: self.pool_account.to_account_info(),
                     to: self.signer.to_account_info() 
                }, 
                 signer_seed
                ), 
               user_share
            )?;

            msg!("User {} claimed {} lamports", self.signer.key(), user_share);
         Ok(())
    }


}



 pub fn claimhandler(ctx:Context<ClaimStruct>) -> Result<()>{
       ctx.accounts.claim_winnings(ctx.bumps.claim_account)?;

       Ok(())
 }