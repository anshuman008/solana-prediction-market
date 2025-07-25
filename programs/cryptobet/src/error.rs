use anchor_lang::prelude::*;




#[error_code]
pub enum BetError {
    #[msg("Invaild time bet duration")]
    InvalidTime,
    #[msg("Invaild target price")]
    InvalidTarget,
    #[msg("Bet starting price is not valid!")]
    InvalidBet
}