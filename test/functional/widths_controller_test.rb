require 'test_helper'

class WidthsControllerTest < ActionController::TestCase
  setup do
    @width = widths(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:widths)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create width" do
    assert_difference('Width.count') do
      post :create, width: { name: @width.name }
    end

    assert_redirected_to width_path(assigns(:width))
  end

  test "should show width" do
    get :show, id: @width
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @width
    assert_response :success
  end

  test "should update width" do
    put :update, id: @width, width: { name: @width.name }
    assert_redirected_to width_path(assigns(:width))
  end

  test "should destroy width" do
    assert_difference('Width.count', -1) do
      delete :destroy, id: @width
    end

    assert_redirected_to widths_path
  end
end
