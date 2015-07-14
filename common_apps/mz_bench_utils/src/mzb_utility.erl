-module(mzb_utility).

-export(
   [
    random_binary/1,
    random_list/1,
    random_number/1,
    random_number/2,
    to_integer_with_default/2,
    int_ceil/1,
    any_to_num/1
   ]).

random_binary(N) -> crypto:rand_bytes(N).

random_list(N) -> erlang:binary_to_list(crypto:rand_bytes(N)).

random_number(N) -> crypto:rand_uniform(0, N).

random_number(N, M) -> crypto:rand_uniform(N, M).

to_integer_with_default(N, _) when is_integer(N) ->
    N;
to_integer_with_default(S, Default) when is_binary(S) ->
    try
        list_to_integer(binary_to_list(S))
    catch _ ->
        Default
    end;
to_integer_with_default(S, Default) when is_list(S) ->
    try
        list_to_integer(S)
    catch _ ->
        Default
    end;
to_integer_with_default(_, Default) ->
    Default.

int_ceil(X) ->
    T = trunc(X),
    case (X - T) of
        Pos when Pos > 0 -> T + 1;
        _ -> T
    end.

any_to_num(Value) when is_integer(Value) or is_float(Value) -> Value;
any_to_num(Value) when is_binary(Value) ->
    any_to_num(binary_to_list(Value)); 
any_to_num(Value) when is_list(Value) -> 
    case string:to_float(Value) of
        {error,no_float} -> list_to_integer(Value);
        {F,_Rest} -> F
    end.


