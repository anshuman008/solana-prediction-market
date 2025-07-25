use anchor_lang::prelude::*;
mod instructions;
mod state;
mod error;
declare_id!("3m1GV4daBTk89EESQWsgEqfUfuiknDqbpp1VjwJu9Vxh");

#[program]
pub mod cryptobet {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
