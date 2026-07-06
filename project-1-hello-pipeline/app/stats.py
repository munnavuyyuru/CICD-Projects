"""Statistics utilities — more code to test and cover."""

from typing import List


def mean(numbers: List[float]) -> float:
    if not numbers:
        raise ValueError("Cannot compute mean of empty list")
    return sum(numbers) / len(numbers)


def median(numbers: List[float]) -> float:
    if not numbers:
        raise ValueError("Cannot compute median of empty list")
    sorted_nums = sorted(numbers)
    n = len(sorted_nums)
    mid = n // 2
    if n % 2 == 1:
        return sorted_nums[mid]
    return (sorted_nums[mid - 1] + sorted_nums[mid]) / 2


def value_range(numbers: List[float]) -> float:
    if not numbers:
        raise ValueError("Cannot compute range of empty list")
    return max(numbers) - min(numbers)
