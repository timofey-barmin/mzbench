import os
import sys

# Exported functions

class mzb_atom(str):
    pass


def notify(metric, value):
    _mzbench_pipe.write("M {{{0}, {1}}}.\n".format(_encode_metric(metric), value))


def get_metric_value(name):
    return _call(mzb_atom('mzb_metrics'), mzb_atom('get_value'), [name])


def _call(module, function, args):
    _mzbench_pipe.write("C {0}.\n".format(_encode_term((module, function, args))))
    return _read_call_result()


# Internal functions
def _instruction_end(result):
    _mzbench_pipe.write("T {0}.\n".format(_encode_term(result)))


def _instruction_failed((t, o, st)):
    _mzbench_pipe.write("E {0} {1}.\n".format(t, o))


def _module_funcs(module_name):
    return dir(module_name)
    #_mzbench_pipe.write("F {0}.\n".format(_encode_term(FuncList)))

def _read_call_result():
    res = sys.stdin.readline().rstrip()
    line_num = int(sys.stdin.readline().rstrip())
    content = []
    while line_num > 0:
        content.append(sys.stdin.readline().rstrip())
        line_num -= 1

    if (res == "OK"):
        return eval("\n".join(content)) if content else None
    else:
        raise Exception("\n".join(content))

def _encode_term(term):
    T = type(term)
    if   (term is None): return "undefined"
    elif (list == T): return _encode_list(term)
    elif (tuple == T): return _encode_tuple(term)
    elif (dict == T): return _encode_dict(term)
    elif (int == T): return _encode_num(term)
    elif (float == T): return _encode_num(term)
    elif (mzb_atom == T): return _encode_atom(term)
    elif (str == T): return _encode_str(term)
    elif (unicode == T): return _encode_str(term)
    else: return _encode_str("<unknown python term: {0}>".format(term))


def _encode_atom(a):
    return "'{0}'".format(a)


def _encode_list(l):
    return '[' + ', '.join([_encode_term(e) for e in l]) + ']'


def _encode_tuple(l):
    return '{' + ', '.join([_encode_term(e) for e in l]) + '}'


def _encode_dict(d):
    return '#{' + ', '.join([ _encode_term(k) + '=>' + _encode_term(d[k]) for k in d]) + '}'


def _encode_num(n):
    return str(n)


def _encode_str(s):
    return '"{0}"'.format(s)


def _encode_funcs_list(func_list):
    return '[' + ', '.join(['"{0}"'.format(e) for e in func_list]) + ']'


def _encode_metric(metric):
    return '{{"{0}", {1}}}'.format(_encode_string_for_erlang(metric[0]), _encode_string_for_erlang(metric[1]))


# May fail in some complicated cases
def _encode_string_for_erlang(string):
    return string.replace('\\', '\\\\').replace('"', '\"')


# MZBench communication initialization
if 'MZ_PYTHON_WORKER_FIFO_NAME' not in os.environ:
    sys.exit("MZ_PYTHON_WORKER_FIFO_NAME environment variable must be defined!")

_mzbench_pipe = open(os.environ['MZ_PYTHON_WORKER_FIFO_NAME'], 'r+', 0)
