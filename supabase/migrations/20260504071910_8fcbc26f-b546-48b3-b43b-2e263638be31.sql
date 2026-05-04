
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  national_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ACCOUNTS
CREATE TYPE public.account_type AS ENUM (
  'savings_classic','savings_family','savings_kids','savings_assets',
  'loan','external_paypal','external_payoneer','primary'
);

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type public.account_type NOT NULL,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  external_identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts select" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own accounts insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own accounts update" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own accounts delete" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TYPE public.txn_type AS ENUM (
  'send_money','pay_bill','bank_transfer','own_transfer','withdraw_mpesa',
  'withdraw_agent','withdraw_crypto','buy_airtime','deposit','loan_disbursement','loan_repayment','interest'
);
CREATE TYPE public.txn_status AS ENUM ('pending','completed','failed');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type public.txn_type NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  recipient TEXT,
  description TEXT,
  status public.txn_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own txns select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own txns insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LOANS
CREATE TYPE public.loan_type AS ENUM ('one_month','business_plus','one_year');
CREATE TYPE public.loan_status AS ENUM ('active','paid','defaulted');

CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_type public.loan_type NOT NULL,
  principal NUMERIC(18,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  term_months INT NOT NULL,
  outstanding_balance NUMERIC(18,2) NOT NULL,
  status public.loan_status NOT NULL DEFAULT 'active',
  disbursed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own loans select" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own loans insert" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own loans update" ON public.loans FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- handle new user: create profile + primary account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_acc_no TEXT := lpad((floor(random()*1000000000)::bigint)::text, 10, '0');
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, national_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'national_id'
  );

  INSERT INTO public.accounts (user_id, account_number, account_name, account_type, balance, interest_rate)
  VALUES (NEW.id, v_acc_no, 'Primary Account', 'primary', 50000, 0);

  INSERT INTO public.accounts (user_id, account_number, account_name, account_type, balance, interest_rate)
  VALUES (NEW.id, lpad((floor(random()*1000000000)::bigint)::text, 10, '0'), 'Classic Savings', 'savings_classic', 0, 10);

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
