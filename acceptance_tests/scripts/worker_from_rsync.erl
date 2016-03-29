[ 
  {make_install, [
    {rsync, {var, "exec_worker_dir"}},
    {exclude, "_build"}]},
  {pool, [{size, 2}, {worker_type, exec_worker}],
    [{execute, "sleep 5"}]}
].