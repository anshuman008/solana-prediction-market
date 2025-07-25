use anchor_lang::prelude::*;




#[error_code]
pub enum BetError {
    #[msg("Invaild time bet duration")]
    InvalidTime,
    #[msg("Invaild target price")]
    InvalidTarget,
    #[msg("Bet starting price is not valid!")]
    InvalidBet,
    #[msg("Inavild creator game state")]
    InvaildCreator,
    #[msg("Not have sufficent balance to bet")]
    InvalidAmount,
    #[msg("total no of transaction overflow")]
    ArithmeticError,
    #[msg("Bet is not active anymore!")]
    BetClosed,
    #[msg("Bet is still in progress")]
    BetInProgress
}