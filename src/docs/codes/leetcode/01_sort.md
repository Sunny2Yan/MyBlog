# 排序

| 排序算法 | 平均时间复杂度 | 最坏复杂度 | 空间复杂度 | 稳定性 |
| :----: | :---------: | :------: | :------: | :---: |
| 冒泡排序 |   O(n^2)    |  O(n^2)  |  O(1)    |  稳定 |
| 选择排序 |   O(n^2)    |  O(n^2)  |  O(1)    | 不稳定 |
| 插入排序 |   O(n^2)    |  O(n^2)  |  O(1)    |  稳定 |
| 快速排序 |   O(nlogn)  |  O(n^2)  | O(nlogn) | 不稳定 |
| 归并排序 |   O(nlogn)  | O(nlogn) |  O(1)    |  稳定 |
| 堆排序  |   O(nlogn)  |  O(nlogn) | O(1)     | 不稳定 |


1. 冒泡排序
- 思路：比较相邻的元素。如果第一个比第二个大，就交换他们两个。(每轮得到一个最大的数)

```python
def bubble(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    for i in range(1, len(nums)):
        for j in range(len(nums) - i):
            if nums[j] > nums[j+1]:
                nums[j], nums[j+1] = nums[j+1], nums[j]

    return nums
```

2. 选择排序
- 思路：初始化一个最小（大）元素位置，遍历列表更新这个位置，如果有小于（大于）这个位置的值时，记录并交换。

```python
def selection(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    for i in range(len(nums) - 1):
        min_ = i
        for j in range(i+1, len(nums)):
            if nums[j] < nums[min_]:
                min_ = j
        nums[i], nums[min_] = nums[min_], nums[i]

    return nums
```

3. 插入排序
- 思路：类似于打扑克原理，定义一个关键点，左边是排序数组，关键点及右边是未排序数组，从未被排序的数组中抽取一个元素，插入到已被排序的数组中。

```python
def insert(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    for i in range(1, len(nums)):
        key_point = nums[i]
        j = i - 1
        while j >= 0 and key_point < nums[j]:
            nums[j+1] = nums[j]
            j -= 1
        nums[j+1] = key_point  # 本是第j个位置，但上面-=1了

    return nums
```

4. 快速排序
- 思路：选择第一个元素作为基准值（pivot），并将列表分成两个子列表：一个包含小于等于基准值的元素，另一个包含大于基准值的元素。然后，我们递归地对这两个子列表进行快速排序

```python
def quick(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    else:
        pivot = nums[0]
        left = [num for num in nums[1:] if num <= pivot]
        right = [num for num in nums[1:] if num > pivot]
        return self.quick(left) + [pivot] + self.quick(right)
```

5. 归并排序
- 思路：采用二分法的思想，递归的对数组进行分区（左、右两个数组），每次对左右两个数组进行排序，并返回排序后的数组。

```python
def merge(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left_nums = self.merge(nums[:mid])
    right_nums = self.merge(nums[mid:])
    return __merge_sub(left_nums, right_nums)


def __merge_sub(left_nums: list[int], right_nums: list[int]):
    left, right, res = 0, 0, []
    while left < len(left_nums) and right < len(right_nums):
        if left_nums[left] <= right_nums[right]:
            res.append(left_nums[left])
            left += 1
        else:
            res.append(right_nums[right])
            right += 1
    res += left_nums[left:]
    res += right_nums[right:]

    return res
```

6. 堆排序
- 大顶堆：每个结点的值都大于或等于其左右孩子结点的值（用于升序）；
- 小顶堆：每个结点的值都小于或等于其左右孩子结点的值（用于降序）；

```python
def heap(nums: list[int]):
    """eg: """
    if len(nums) <= 1:
        return nums
    # 子节点找父节点：n->(n-1)//2，子节点位置为L-1
    for i in range((len(nums) - 2) // 2, -1, -1):
        # 1.建立初始堆,由于end不好找，让他一直为列表末尾
        __heap_adjust(nums, i, len(nums) - 1)
    # 进行n-1趟排序,j指向当前最后一个位置
    for j in range(len(nums) - 1, -1, -1):
        # 根与最后一个元素交换
        nums[0], nums[j] = nums[j], nums[0]
        # 2.重新建堆，j-1是新的end
        __heap_adjust(nums, 0, j - 1)

    return nums


def __heap_adjust(nums: list[int], start: int, end: int):
    """先把数组构造成大顶堆（父节点大于子节点），然后把堆顶和数组最后一个元素交换；
    再对前 n-1个元素进行堆排序。此处调整为大顶堆
    """
    temp = nums[start]  # 根节点
    i = start
    j = 2 * i + 1  # 根的左子树，右子树2*i+2
    while j <= end:
        if j + 1 <= end and nums[j] < nums[j + 1]:  # 若左子树小于右子树，j指向右子树
            j += 1
        if temp < nums[j]:  # 如果子节点大于根节点，则交换。
            nums[i] = nums[j]
            i = j  # 往下看一层
            j = 2 * i + 1
        else:
            break
    nums[i] = temp  # temp大，把temp放到i的位置即可/i为最后一个节点，没有j，就需要把temp放到i位置
```

7. 希尔排序

8. 计数排序

9. 桶排序 

10. 基数排序