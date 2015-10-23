#!/usr/bin/env python

import os
import shlex
import subprocess
import sys
import nose
import re

dirname = os.path.dirname(os.path.realpath(__file__))
os.chdir(dirname)
sys.path.append("../lib")

import util
from mzb_test_utils import run_failing_bench, start_mzbench_server

mzbench_dir = dirname + '/../'
scripts_dir = mzbench_dir + 'acceptance_tests/scripts/'
mzbench_script = mzbench_dir + 'bin/mzbench'

def emulate_crash_test():
    run_failing_bench(scripts_dir + 'correct_script.erl',
        env={'emulate_bench_crash': 'true'},
        expected_log_message_regex=r"\[error\].*Benchmark received 'EXIT' from .* with reason {emulated_crash,\n\s*nothing_to_see_here,\n\s*please_move_along},")


def syntax_error_test():
    p = subprocess.Popen(
        shlex.split('../bin/mzbench start scripts/syntax_error.erl'),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    (out, err) = p.communicate()
    assert p.returncode != 0
    expected_out = '''Syntax error: Rule 'entry' matched in its entirety, but it didn't consume all the text. The non-matching portion of the text begins with '{pool, [],\n[}.\n' (line 1, column 1).'''
    assert util.multiline_strip(out) == util.multiline_strip(expected_out)


def runtime_error_test():
    run_failing_bench(scripts_dir + 'runtime_error.erl',
        expected_log_message_regex=r'\[error\].*Worker.*has crashed: "no_because_no"')


def env_param_missing_test():
    run_failing_bench(scripts_dir + 'env.erl', env={},
        expected_log_message_regex=r'''\[error\].*Stage 'pipeline - running': failed.*Unexpected error: {{{var_is_unbound,"pool_size"}''')


def signal_timeout_test():
    run_failing_bench(scripts_dir + 'signal_count_neg.erl', env={},
        expected_log_message_regex=r'\[error\].*Worker.*has crashed: {timeout,{wait_signal,"A"}}')

def worker_provisioning_fail_test():
    worker_commit = 'this_revision_does_not_exist'
    mzbench_repo = os.environ.get('MZBENCH_REPO', 'https://github.com/machinezone/mzbench')
    run_failing_bench(
        scripts_dir + 'worker_from_git.erl',
        env={'worker_branch': worker_commit,
             'mzbench_repo':  mzbench_repo},
        expected_log_message_regex=r"Stage 'pipeline - provisioning': failed",
        check_log_function=lambda log:\
            "Error: tried to stop mzbench node, but it didn't even start!"\
            if len(re.findall('mzbench stop', log)) > len(re.findall('mzbench stop; true', log))\
            else None)

def time_assertions_fail_test():
    run_failing_bench(scripts_dir + 'time_assertion_fail.erl', env={},
        expected_log_message_regex=r'\[error\].*Command execution failed.*Output: FAILED\n1 assertions failed\nAssertion: print.value > 40')


def always_assertions_fail_test():
    run_failing_bench(scripts_dir + 'always_assertion_fail.erl', env={},
        expected_log_message_regex=r'\[error\].*Interrupting benchmark because of failed asserts')


def main():
    from nose.plugins.multiprocess import MultiProcess
    with start_mzbench_server():
        if not nose.run(defaultTest=__name__, addplugins=[MultiProcess()]):
            raise RuntimeError("some tests failed")

if __name__ == '__main__':
    main()
