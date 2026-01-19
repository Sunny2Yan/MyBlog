# 递归-回溯

先判断终止条件，再递归，最后回溯，一定要实时注意剪枝。

递归、回溯于与DFS的区别：
1. DFS是一种遍历方式，递归是一种算法结构，回溯是一种算法思想；
2. 递归是在函数中调用函数本身来解决问题；回溯是通过不同的尝试来生成问题的解，类似于穷举（但会剪枝）；回溯搜索是DFS的一种；


## 子集
1. 无重复元素的子集

(leetcode 78, 剑指offer 79) 给定无重复元素的数组nums，返回数组所有的子集。
- 思路：遍历所有路径，将每一个 path 都加入到 res 中，无需终止条件。
- 时O(n * 2^n); 空O(n)

```python
def subsets(nums: list[int]) -> list[list[int]]:
    res, path = [], []

    def recursive(satrt: int):
        res.append(path[:])
        for i in range(satrt, len(nums)):
            path.append(nums[i])
            recursive(i + 1)
            path.pop()
    
    recursive(0)
    return res
```

2. 含重复元素的子集

(leetcode 90) 给定含重复元素的数组nums，返回数组所有的子集。
- 思路：同上，但由于含有重复元素（注意需要先排序），需要去重，即同一层递归中跳过重复元素
- 时O(n * 2^n); 空O(n)

```python
def subsets(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res, path = [], []

    def recursive(start: int):
        res.append(path[:])

        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i -1]:  # 跳过重复元素
                continue

            path.append(nums[i])
            recursive(i + 1)
            path.pop()
    
    recursive(0)
    return res
```

## 排列

3. 无重复元素的全排列

(leetcode 46，剑指offer 83) 给一个不含重复数字的数组，返回其所有可能的全排列。
- 思路：递归函数维护path列表，判断终止条件（len(path)=len(nums)），然后遍历nums中的每一个元素，对于未被使用的加入path中，然后递归回溯，同时注意维护used列表。
- 时O(n*n!); 空O(n)

```python
def permute(nums: list[int]) -> list[list[int]]:
    res, used = [], [False] * len(nums)

    def recursion(path: list[int]):
        if len(path) == len(nums):
            # 由于在回溯过程中path list会被反复修改,如果直接加入结果集，保存的是引用而不是快照；
            res.append(path[:])  # 拷贝
            return  # 避免继续执行

        for i in range(len(nums)):
            if used[i]:
                continue

            path.append(nums[i])  # 选择
            used[i] = True

            recursion(path)  # 递归

            path.pop()  # 回溯
            used[i] = False

    recursion([])
    return res
```

4. 含重复元素的全排列

(leetcode 47, 剑指offer 84) 给定一个数组，按任意顺序返回所有不重复的全排列。
- 思路：（也可以按上面全排列然后去重）此处去重采用剪枝的方法，即删除同一层重复的元素。
- 时O(n*n!); 空O(n)

```python
def permute(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res, used = [], [False] * len(nums)

    def recursion(path: list[int]):
        if len(path) == len(nums):
            res.append(path[:])
            return
        
        for i in range(len(nums)):
            if used[i]:
                continue
            
            # 数组中当前元素与前面一个相同，且前面一个元素被用过一次，则这个元素不可重复使用
            if i > 0 and nums[i] == nums[i-1] and used[i-1]:
                continue

            path.append(nums[i])
            used[i] = True

            recursion(path)

            path.pop()
            used[i] = False

    recursion([])
    return res
```

## 组合

5. 组合

(leetcode 77) 返回数组[1, n]中所有可能的 k 个数的组合。
- 思路：同全排列，并将 i 放入 path，再递归 i+1
- 时O(C_n^k * k); 空O(n)

```python
def combine(n: int, k: int):
    res, path = [], []

    def recursion(start: int):
        if len(path) + (n - start + 1) < k:  # 当前元素 + 剩余元素小于 k 的剪枝
            return
        
        if len(path) == k:
            res.append(path[:])
            return

        for i in range(start, n+1):
            path.append(i)
            recursion(i + 1)  # 当前元素已经添加，要从下一个元素开始递归
            path.pop()
            
    recursion(1)
    return res
```
    
6. 无重复元素的组合总和

(leetcode 39) 给定无重复元素的整数数组candidates和整数target，找出candidates 中和为target的所有不同组合。
- 思路：整体同上，但由于同一个数字可以被多次使用，所以递归时，每次要从起点开始。
- 时O(n * 2^n); 空O(n)

```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    candidates.sort()  # 为了剪枝，需要排序
    res, path = [], []

    def recursive(start: int, remain: int):
        if remain == 0:
            res.append(path[:])
            return 
        elif remain < 0:
            return 

        for i in range(start, len(candidates)):
            if candidates[i] > remain:
                break
            path.append(candidates[i])
            recursive(i, remain - candidates[i])  # 可以重复使用
            path.pop()

    recursive(0, target)
    return res
```

7. 含重复元素的组合总和

(leetcode 40) 给定含重复元素数组candidates和目标数target，找出candidates中和为target的组合。
- 思路：含有重复元素，需要去重，对candidates排序并判断temp[:]不在res中，注意此题每个数字只使用一次。
- 时O(n * 2^n); 空O(n)

```python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    candidates.sort()
    res, path = [], []

    def recursive(start: int, remain: int):
        if remain == 0:
            res.append(path[:])
            return
        elif remain < 0:
            return
        
        for i in range(start, len(candidates)):
            if candidates[i] > remain:  # 剪枝，减小复杂度
                break
            
            if i > start and candidates[i] == candidates[i - 1]:  # 过滤重复元素
                continue
            
            path.append(candidates[i])
            recursive(i + 1, remain - candidates[i])  # 每个数字只使用一次
            path.pop()

    recursive(0, target)
    return res
```