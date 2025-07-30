use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::error::BetError;
use crate::state::BetState;
use crate::state::UserClaim;

#[derive(Accounts)]
pub struct BetStruct<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

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

    // user state
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
    pub claim_state: Account<'info, UserClaim>,

    // programs
    pub system_program: Program<'info, System>,
}

impl<'info> BetStruct<'info> {

    pub fn claiminitialize(&mut self, bump: u8,bet:u8) -> Result<()> {

        self.claim_state.set_inner(UserClaim {
            user: self.signer.key(),
            bet_side: bet,
            bet_market: self.bet_state.key(),
            claimed: false,
            amount: 0,
            claim_timestamp: Clock::get()?.unix_timestamp as u64,
            bump: bump,
        });

        Ok(())
    }

    pub fn bet(&mut self, bet: u8) -> Result<()> {
        require!(self.bet_state.is_active == true, BetError::BetClosed);

        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp as u64;

        let duration_passed = current_time - self.bet_state.start_duration;

        require!(
            duration_passed <= self.bet_state.bet_duration,
            BetError::BetInResolve
        );

        require!(
            self.signer.lamports() > self.bet_state.bet_price,
            BetError::InvalidAmount
        );

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.signer.to_account_info(),
                    to: self.pool_account.to_account_info(),
                },
            ),
            self.bet_state.bet_price,
        )?;


        if bet == 0 {
           self.bet_state.no_voters = self.bet_state.no_voters.checked_add(1).ok_or(BetError::ArithmeticError)?;
        }
        else{
            self.bet_state.yes_voters = self.bet_state.yes_voters.checked_add(1).ok_or(BetError::ArithmeticError)?;
        }


        self.bet_state.total_transactions = self.bet_state
            .total_transactions
            .checked_add(1)
            .ok_or(BetError::ArithmeticError)?;


        let game_fees: u64 = self
            .bet_state
            .betfees
            .try_into()
            .map_err(|_| BetError::ArithmeticError)?;

        let fees: u64 = game_fees
            .checked_mul(self.bet_state.bet_price)
            .ok_or(BetError::ArithmeticError)?
            .checked_div(10000)
            .ok_or(BetError::ArithmeticError)?;



        let signer_seeds:&[&[&[u8]]]= &[&[
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
                    to: self.creator.to_account_info(),
                },
                signer_seeds
            ),
            fees,
        )?;

     self.bet_state.pool_balance = self.bet_state.pool_balance
       .checked_add(self.bet_state.bet_price.checked_sub(fees).ok_or(BetError::ArithmeticError)?)
       .ok_or(BetError::ArithmeticError)?;

        Ok(())
    }
}

pub fn bethandlder(ctx: Context<BetStruct>, bet: u8) -> Result<()> {

    ctx.accounts.claiminitialize(ctx.bumps.claim_state, bet);
    ctx.accounts.bet(bet)?;

    Ok(())
}
