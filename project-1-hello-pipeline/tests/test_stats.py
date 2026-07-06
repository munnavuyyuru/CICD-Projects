import pytest

from app.stats import mean, median, value_range


def test_mean():
    assert mean([1, 2, 3, 4]) == 2.5


def test_mean_empty_raises():
    with pytest.raises(ValueError):
        mean([])


def test_median_odd():
    assert median([3, 1, 2]) == 2


def test_median_even():
    assert median([1, 2, 3, 4]) == 2.5


def test_value_range():
    assert value_range([10, 2, 8]) == 8


def test_median_empty_raises():
    with pytest.raises(ValueError):
        median([])


def test_value_range_empty_raises():
    with pytest.raises(ValueError):
        value_range([])
