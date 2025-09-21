# Natural Language Test Examples

These are test cases for the natural language parser using the enhanced test data.

## Basic Examples

```
add coffee 10 @ Starbucks
add lunch 25 @ McDonald's
add taxi 15 with kbank
add gas 50 @ Shell
```

## Multiple Items

```
add coffee 10, croissant 5 @ Starbucks
add lunch 25, drink 3 @ McDonald's
add gas 50, car_wash 15 @ Shell
```

## With Payment Methods

```
add coffee 10 @ Starbucks with kbank
add lunch 25 @ McDonald's with visa
add gas 50 @ Shell with cash
add snacks 15 @ 7-Eleven with promptpay
```

## With Currency

```
add coffee 10 THB @ Starbucks
add lunch 25 USD @ McDonald's
add gas 50 @ Shell
```

## With Entity

```
add coffee 10 @ Starbucks for Personal
add office_supplies 250 for Biz1
add marketing_ads 1000 for Biz1
```

## With Date

```
add coffee 10 @ Starbucks on today
add lunch 25 @ McDonald's on yesterday
add gas 50 @ Shell on 2025/01/15
```

## With Memo

```
add coffee 10 @ Starbucks memo "morning coffee before meeting"
add lunch 25 @ McDonald's memo "lunch with John from accounting"
add gas 50 @ Shell memo "fuel for weekend trip to Pattaya"
```

## Complex Examples

```
add coffee 10 THB, croissant 5 THB @ Starbucks with kbank for Personal on today memo "morning coffee and pastry"
add lunch 25 USD @ McDonald's with visa for Personal on yesterday memo "client meeting lunch"
add gas 50 @ Shell with cash for Personal memo "road trip fuel"
```

## Expected Output Examples

### Input: `add coffee 10 @ Starbucks`

```
2025/01/15 Starbucks
    Personal:Expenses:Food:Coffee           10.00 THB
    Personal:Assets:Bank:KBank:Checking    -10.00 THB
```

### Input: `add coffee 10, croissant 5 @ Starbucks with kbank`

```
2025/01/15 Starbucks
    Personal:Expenses:Food:Coffee           10.00 THB
    Personal:Expenses:Food:Restaurant        5.00 THB
    Personal:Assets:Bank:KBank:Checking    -15.00 THB
```

### Input: `add office_supplies 250 for Biz1`

```
2025/01/15 Office Supplies
    Biz1:Expenses:Office:Supplies           250.00 THB
    Biz1:Assets:Bank:Bangkok:Business       -250.00 THB
```

### Input: `add coffee 10 @ Starbucks memo "morning coffee"`

```
2025/01/15 Starbucks
    Personal:Expenses:Food:Coffee           10.00 THB
    Personal:Assets:Bank:KBank:Checking    -10.00 THB
    ; morning coffee
```

## Test Cases for Rules

### Item Rules

- `coffee` → `Personal:Expenses:Food:Coffee`
- `lunch` → `Personal:Expenses:Food:Restaurant`
- `taxi` → `Personal:Expenses:Transport:Taxi`
- `gas` → `Personal:Expenses:Transport:Gas`

### Merchant Rules

- `@ Starbucks` → confirms coffee account
- `@ McDonald's` → confirms restaurant account
- `@ Shell` → confirms gas account

### Payment Rules

- `with kbank` → `Personal:Assets:Bank:KBank:Checking`
- `with visa` → `Personal:Liabilities:CreditCard:Visa`
- `with cash` → `Personal:Assets:Cash`
- `with promptpay` → `Personal:Assets:Bank:KBank:Checking`

### Entity Rules

- `for Personal` → uses Personal accounts
- `for Biz1` → uses Biz1 accounts

### Defaults

- Default entity: `Personal`
- Default currency: `THB`
- Default credit: `Personal:Assets:Bank:KBank:Checking`
